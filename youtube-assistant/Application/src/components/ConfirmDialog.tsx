'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            style={confirmVariant === 'danger' ? styles.dangerBtn : styles.primaryBtn}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '360px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--foreground)',
    marginBottom: '8px',
  },
  message: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid rgba(128,128,128,0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--error)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  primaryBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
