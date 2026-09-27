import pandas as pd
import numpy as np

print("[*] Génération de 3 000 profils sénégalais diversifiés (Social Sellers, Étudiants, Tiak-Tiak, Artisans, Boutiques)...")
np.random.seed(42)
n = 3000

# 1. Diversité des segments de l'économie informelle
segments = [
    "Vente en Ligne (Instagram / TikTok / WhatsApp)",
    "Étudiant & Micro-Freelance (UCAD / UVS)",
    "Livreur Tiak-Tiak & Chauffeur VTC",
    "Atelier Couture & Coiffure à domicile",
    "Commerce Physique (Boutique de quartier / Marché)"
]

# 80% des utilisateurs ont un profil COMBINÉ (Business + Vie Perso sur le même Wave)
types_profil = ["COMBINÉ (Business + Particulier)", "PARTICULIER PUR (Étudiant / Salarié informel)"]

data = {
    "user_id": [f"SN-DKR-{1000+i}" for i in range(n)],
    "segment_informel": np.random.choice(segments, n, p=[0.25, 0.20, 0.20, 0.15, 0.20]),
    "type_compte": np.random.choice(types_profil, n, p=[0.80, 0.20]),
    
    # Volet Business (Encaissements ventes, stock, livraisons)
    "ca_mensuel_wave_om": np.random.gamma(shape=4, scale=90000, size=n).astype(int), # ~360k FCFA
    "nb_ventes_semaine": np.random.poisson(lam=16, size=n),
    "volume_cash_qr_p2p": np.random.gamma(shape=2, scale=20000, size=n).astype(int),
    "depenses_reappro_stock": np.random.gamma(shape=3, scale=40000, size=n).astype(int),
    
    # Volet Particulier (Vie courante, loyer, tontine, électricité)
    "woyofal_ponctualite_streak": np.random.randint(1, 24, size=n),
    "anciennete_sim_annees": np.round(np.random.exponential(scale=3, size=n) + 0.6, 1),
    "adhesion_tontine_active": np.random.choice([1, 0], n, p=[0.65, 0.35]),
    "depenses_paris_sportifs": np.random.choice([0, 1], n, p=[0.85, 0.15]), # 15% flanchent sur 1xBet
    
    # Localisation & canaux
    "canal_principal": np.random.choice(["WhatsApp Business", "Wave QR Marchand", "Livraison Directe", "Boutique Physique"], n),
    "zone_dakar": np.random.choice(["Médina", "Almadies/Ngor", "Parcelles Assainies", "Sandaga", "Pikine/Guédiawaye", "Fann/UCAD"], n),
    
    # Label de décision bancaire finale
    "statut_credit_bancaire": np.random.choice(["SOLVABLE_A+", "ÉMERGENT_B", "RISQUE_C"], n, p=[0.60, 0.28, 0.12])
}

df = pd.DataFrame(data)
df.to_csv("data/senegal_acs_dataset.csv", index=False)
print(f"[✓] Fichier généré : 'data/senegal_acs_dataset.csv' avec {len(df)} profils diversifiés !")
