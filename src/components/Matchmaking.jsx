import React from 'react';

export default function Matchmaking({ mode, onCancel, isConnected }) {
    return (
        <div className="card fade-in" style={{ textAlign: 'center' }}>
            <div className="loader" style={{ fontSize: '4rem', marginBottom: '2rem', animation: 'spin 2s linear infinite' }}>
                {isConnected ? '⏳' : '🔌'}
            </div>
            <h2>{isConnected ? 'Rakip Aranıyor...' : 'Sunucuya Bağlanılıyor...'}</h2>

            {!isConnected && (
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
                    Bağlantı bekleniyor. Lütfen internetini kontrol et.
                </p>
            )}

            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Mod: {mode === 'mixed' ? 'Karışık' : mode}
            </p>
            <button onClick={onCancel} className="danger">
                İptal Et
            </button>
            <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
