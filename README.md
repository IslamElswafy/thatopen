# IFC Viewer - Projet Laboratoire

## 📋 Description
Ce projet est un visualiseur IFC. Il permet de visualiser, manipuler et analyser des modèles IFC (Industry Foundation Classes) directement dans le navigateur avec des fonctionnalités avancées.

## ✨ Fonctionnalités

- 🎯 Importation de fichiers IFC
- 📑 Liste des modèles chargés
- 🔍 Classification des éléments
- ✂️ Plans de coupe dynamiques
- 🖱️ Interaction au survol des éléments
- 🎨 Personnalisation des couleurs et de l'opacité
- 🔄 Interface utilisateur responsive

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/thatopen.git

# Se déplacer dans le dossier du projet
cd thatopen/frontend/renderer

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🛠️ Technologies utilisées

- That Open BIM Components (@thatopen/components)
- That Open UI (@thatopen/ui)
- That Open UI OBC (@thatopen/ui-obc)
- Three.js
- TypeScript
- Vite

## 📁 Structure du projet

```
frontend/renderer/
├── src/
│   ├── modules/         # Modules fonctionnels (clipper, raycaster, etc.)
│   ├── panels/         # Composants d'interface utilisateur
│   ├── modals/         # Boîtes de dialogue modales
│   ├── inits/          # Initialisation du renderer
│   ├── overrides/      # Surcharges de comportements
│   └── index.ts        # Point d'entrée de l'application
├── html/              # Pages HTML et assets
└── package.json       # Dépendances et scripts
```

## 🎮 Utilisation

1. Lancez l'application avec `npm run dev`
2. Ouvrez votre navigateur sur `http://localhost:3000`
3. Utilisez le bouton d'importation pour charger un fichier IFC
4. Interagissez avec le modèle :
   - Double-clic pour créer un plan de coupe
   - Touche Delete pour supprimer un plan
   - Survol des éléments pour les mettre en évidence

## 📝 License

[MIT](LICENSE)