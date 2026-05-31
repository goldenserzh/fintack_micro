import { useState, useRef } from 'react';
import { parseTransactionsFromText, parseTransactionsFromImage, ParsedTransaction } from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'food',          label: 'Еда',          icon: '🍔' },
  { id: 'transport',     label: 'Транспорт',     icon: '🚗' },
  { id: 'entertainment', label: 'Развлечения',   icon: '🎮' },
  { id: 'shopping',      label: 'Покупки',       icon: '🛍️' },
  { id: 'health',        label: 'Здоровье',      icon: '💊' },
  { id: 'other',         label: 'Прочее',        icon: '📦' },
];

type Mode = 'clipboard' | 'voice' | 'photo';
type Step = 'input' | 'parsing' | 'review';

interface Props {
  onClose: () => void;
  onImport: (transactions: ParsedTransaction[]) => void;
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'транзакцию';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'транзакции';
  return 'транзакций';
}

export default function QuickImport({ onClose, onImport }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('clipboard');
  const [step, setStep] = useState<Step>('input');
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [clipText, setClipText] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleParse = async (text?: string, file?: File) => {
    if (!user) return;
    setStep('parsing');
    setError(null);
    try {
      const transactions = file
        ? await parseTransactionsFromImage(user.user_id, file)
        : await parseTransactionsFromText(user.user_id, text ?? '');

      if (transactions.length === 0) {
        setError('Транзакции не найдены. Попробуйте переформулировать или использовать другой способ ввода.');
        setStep('input');
        return;
      }
      setParsed(transactions);
      setStep('review');
    } catch {
      setError('Ошибка при разборе. Проверьте соединение.');
      setStep('input');
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      setError('Ваш браузер не поддерживает голосовой ввод (попробуйте Chrome)');
      return;
    }
    const rec = new SR();
    rec.lang = 'ru-RU';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setVoiceText(transcript);
      setIsRecording(false);
      handleParse(transcript);
    };
    rec.onerror = () => { setError('Ошибка записи голоса'); setIsRecording(false); };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    setVoiceText('');
    setError(null);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const update = (idx: number, field: keyof ParsedTransaction, value: string | number) => {
    setParsed(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const remove = (idx: number) => setParsed(prev => prev.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    onImport(parsed.filter(t => t.amount > 0 && t.name.trim()));
    onClose();
  };

  const MODES: { id: Mode; icon: string; label: string }[] = [
    { id: 'clipboard', icon: '📋', label: 'Текст / SMS' },
    { id: 'voice',     icon: '🎙️', label: 'Голос' },
    { id: 'photo',     icon: '📷', label: 'Фото чека' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qi-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="qi-header">
          <div>
            <h3 className="qi-title">
              {step === 'review' ? `Найдено: ${parsed.length} ${plural(parsed.length)}` : 'Быстрый импорт'}
            </h3>
            <p className="qi-subtitle">
              {step === 'review'
                ? 'Проверьте и отредактируйте перед добавлением'
                : 'ИИ распознает расходы автоматически'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Input step */}
        {step !== 'review' && (
          <>
            <div className="qi-tabs">
              {MODES.map(m => (
                <button
                  key={m.id}
                  className={`qi-tab ${mode === m.id ? 'qi-tab-active' : ''}`}
                  onClick={() => { setMode(m.id); setError(null); }}
                >
                  <span className="qi-tab-icon">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="qi-body">
              {/* ── Clipboard / text mode ── */}
              {mode === 'clipboard' && (
                <div className="qi-section">
                  <p className="qi-hint">
                    Вставьте SMS-уведомление от банка, push-уведомление или просто напишите расходы:
                    <em> «Бензин 1500 и кофе 250»</em>
                  </p>
                  <textarea
                    className="form-input qi-textarea"
                    placeholder={'Оплата в Пятёрочка 847 руб.\n\nили: «Потратил 1500 на бензин и 250 на кофе»'}
                    value={clipText}
                    onChange={e => setClipText(e.target.value)}
                    rows={5}
                  />
                  <div className="qi-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        try {
                          setClipText(await navigator.clipboard.readText());
                        } catch {
                          setError('Нет доступа к буферу обмена');
                        }
                      }}
                    >
                      📋 Вставить из буфера
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!clipText.trim() || step === 'parsing'}
                      onClick={() => handleParse(clipText)}
                    >
                      Распознать →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Voice mode ── */}
              {mode === 'voice' && (
                <div className="qi-section qi-voice-section">
                  <p className="qi-hint">
                    Нажмите и продиктуйте расходы, например:<br />
                    <em>«Закинул 1500 рублей за бензин и купил кофе за 250»</em>
                  </p>
                  <button
                    className={`qi-record-btn ${isRecording ? 'qi-record-active' : ''}`}
                    onClick={isRecording ? stopVoice : startVoice}
                    disabled={step === 'parsing'}
                  >
                    <span className="qi-record-icon">{isRecording ? '⏹' : '🎙️'}</span>
                    <span>{isRecording ? 'Остановить' : 'Начать запись'}</span>
                  </button>
                  {voiceText && (
                    <div className="qi-voice-result">
                      <span className="qi-voice-label">Распознано:</span>
                      <span className="qi-voice-text">«{voiceText}»</span>
                    </div>
                  )}
                  {step === 'parsing' && (
                    <div className="qi-parsing">
                      <div className="spinner" style={{ width: 22, height: 22 }} />
                      <span>Анализирую...</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Photo mode ── */}
              {mode === 'photo' && (
                <div className="qi-section">
                  <p className="qi-hint">
                    Сфотографируйте чек или загрузите изображение — ИИ распознает все позиции и суммы.
                  </p>
                  <div
                    className={`qi-dropzone ${step === 'parsing' ? 'qi-dropzone-loading' : ''}`}
                    onClick={() => step !== 'parsing' && fileRef.current?.click()}
                  >
                    {step === 'parsing' ? (
                      <>
                        <div className="spinner" />
                        <span className="qi-dropzone-text">Анализирую чек...</span>
                      </>
                    ) : (
                      <>
                        <span className="qi-dropzone-icon">📷</span>
                        <span className="qi-dropzone-text">Нажмите для выбора фото</span>
                        <span className="qi-dropzone-sub">JPG, PNG, WEBP до 10 МБ</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleParse(undefined, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Review step */}
        {step === 'review' && (
          <div className="qi-review">
            <div className="qi-review-list">
              {parsed.map((tx, idx) => (
                <div key={idx} className="qi-review-row">
                  <input
                    className="form-input qi-review-name"
                    value={tx.name}
                    onChange={e => update(idx, 'name', e.target.value)}
                    placeholder="Название"
                  />
                  <div className="qi-review-amount-wrap">
                    <input
                      className="form-input qi-review-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tx.amount}
                      onChange={e => update(idx, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <span className="qi-review-currency">₽</span>
                  </div>
                  <select
                    className="form-select qi-review-cat"
                    value={tx.category}
                    onChange={e => update(idx, 'category', e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                  <button
                    className="qi-remove-btn"
                    onClick={() => remove(idx)}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="qi-review-footer">
              <button className="btn btn-secondary" onClick={() => { setStep('input'); setParsed([]); }}>
                ← Назад
              </button>
              <button
                className="btn btn-primary"
                disabled={parsed.length === 0}
                onClick={handleConfirm}
              >
                Добавить {parsed.length} {plural(parsed.length)} →
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ margin: '0.75rem 0 0' }}>{error}</div>
        )}
      </div>
    </div>
  );
}
