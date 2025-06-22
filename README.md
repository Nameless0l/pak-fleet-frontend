# Documentation PAK Fleet Management

## Table des matières

1. [Présentation du projet](#présentation-du-projet)
2. [Prérequis - Installation de l&#39;environnement](#prérequis---installation-de-lenvironnement)
3. [Installation du Backend (Laravel)](#installation-du-backend-laravel)
4. [Installation du Frontend (Next.js)](#installation-du-frontend-nextjs)
5. [Lancement du projet](#lancement-du-projet)
6. [Identifiants de connexion](#identifiants-de-connexion)
7. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

---

## 1. Présentation du projet

PAK Fleet Management est une application de gestion de flotte automobile développée pour le Port Autonome de Kribi. Elle permet de :

- Gérer les véhicules du parc automobile
- Suivre les opérations de maintenance
- Gérer les stocks de pièces détachées
- Générer des rapports détaillés

Le projet est composé de deux parties :

- **Backend** : API développée avec Laravel (PHP)
- **Frontend** : Interface utilisateur développée avec Next.js (React)

---

## 2. Prérequis - Installation de l'environnement

### 2.1 Installation de PHP

#### Sur Windows :

1. Téléchargez XAMPP depuis : https://www.apachefriends.org/download.html
2. Choisissez la version pour Windows avec PHP 8.2
3. Lancez l'installateur et suivez les instructions
4. Installez dans `C:\xampp` (chemin par défaut)
5. Une fois installé, ouvrez le panneau de contrôle XAMPP et démarrez Apache et MySQL

#### Sur Mac :

1. Téléchargez XAMPP depuis : https://www.apachefriends.org/download.html
2. Choisissez la version pour macOS
3. Ouvrez le fichier .dmg et glissez XAMPP dans Applications
4. Ouvrez XAMPP et démarrez les services

#### Sur Linux (Ubuntu/Debian) :

```bash
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mysql php8.2-xml php8.2-curl php8.2-gd php8.2-mbstring php8.2-zip
```

### 2.2 Installation de Composer

Composer est nécessaire pour gérer les dépendances PHP.

#### Sur Windows :

1. Allez sur https://getcomposer.org/download/
2. Téléchargez et exécutez "Composer-Setup.exe"
3. Suivez l'assistant d'installation

#### Sur Mac/Linux :

Ouvrez un terminal et exécutez :

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2.3 Installation de Node.js

Node.js est nécessaire pour le frontend.

1. Allez sur https://nodejs.org/
2. Téléchargez la version LTS (recommandée)
3. Lancez l'installateur et suivez les instructions

### 2.4 Installation de Git

Git est nécessaire pour télécharger le projet.

#### Sur Windows :

1. Téléchargez Git depuis : https://git-scm.com/download/win
2. Lancez l'installateur et gardez les options par défaut

#### Sur Mac :

Git est généralement déjà installé. Sinon :

```bash
brew install git
```

#### Sur Linux :

```bash
sudo apt install git
```

---

## 3. Installation du Backend (Laravel)

### 3.1 Télécharger le projet

1. Ouvrez un terminal (ou l'invite de commandes sur Windows)
2. Naviguez vers le dossier où vous voulez installer le projet :

   ```bash
   cd C:\projets  # Windows
   cd ~/projets   # Mac/Linux
   ```
3. Clonez le projet (remplacez l'URL par celle de votre dépôt) :

   ```bash
   git clone https://github.com/Nameless0l/pak-fleet-backend.git
   ```

### 3.2 Configuration du Backend

1. Naviguez vers le dossier backend :

   ```bash
   cd pak-fleet-backend
   ```
2. Installez les dépendances PHP :

   ```bash
   composer install
   ```

   Si vous avez une erreur, essayez :

   ```bash
   composer install --ignore-platform-reqs
   ```
3. Copiez le fichier de configuration :

   ```bash
   cp .env.example .env
   ```

   Sur Windows, utilisez :

   ```bash
   copy .env.example .env
   ```
4. Générez la clé d'application :

   ```bash
   php artisan key:generate
   ```
5. Créez la base de données SQLite :

   ```bash
   touch database/database.sqlite
   ```

   Sur Windows PowerShell :

   ```bash
   New-Item database/database.sqlite
   ```
6. Exécutez les migrations pour créer les tables :

   ```bash
   php artisan migrate
   ```
7. Chargez les données de test :

   ```bash
   php artisan db:seed
   ```

  
8. Créez le lien symbolique pour le stockage :

   ```bash
   php artisan storage:link
   ```

---

## 4. Installation du Frontend (Next.js)

1. Ouvrez un nouveau terminal et naviguez vers le dossier frontend :

   ```bash
   git clone https://github.com/Nameless0l/pak-fleet-frontend.git
   ```
   ```bash
   cd pak-fleet-frontend
   ```
2. Installez les dépendances :

   ```bash
   npm install
   ```

   Si vous avez des erreurs, essayez :

   ```bash
   npm install --force
   ```
3. Créez le fichier de configuration :

   ```bash
   cp .env.example .env.local
   ```

   Sur Windows :

   ```bash
   copy .env.example .env.local
   ```
4. Veuillez lire les commentaires du `.env.local` :


---

## 5. Lancement du projet

### 5.1 Démarrer le Backend

1. Dans le terminal du backend (`pak-fleet/pak-fleet-backend`), lancez :

   ```bash
   php artisan serve
   ```

   Le backend sera accessible sur : http://localhost:8000

### 5.2 Démarrer le Frontend

1. Dans le terminal du frontend (`pak-fleet/pak-fleet-frontend`), lancez :

   ```bash
   npm run dev
   ```

   Le frontend sera accessible sur : http://localhost:3000

### 5.3 Accéder à l'application

Ouvrez votre navigateur et allez sur : http://localhost:3000

---

## 6. Identifiants de connexion

L'application a deux types d'utilisateurs :

### Chef de Service (accès complet) :

- **Email** : chef@pak.cm
- **Mot de passe** : password123

### Techniciens :

- **Email** : jean@pak.cm
- **Mot de passe** : password123
- **Email** : marie@pak.cm
- **Mot de passe** : password123

### Fonctionnalités par rôle :

**Chef de Service peut :**

- Voir le tableau de bord complet
- Gérer les véhicules (ajouter, modifier, supprimer)
- Valider les opérations de maintenance
- Gérer les utilisateurs
- Générer des rapports
- Gérer les pièces détachées

**Technicien peut :**

- Voir le tableau de bord
- Consulter les véhicules
- Créer des opérations de maintenance
- Gérer le stock de pièces détachées

---

## 7. Résolution des problèmes courants

### Problème : "composer: command not found"

**Solution** : Composer n'est pas installé ou pas dans le PATH. Réinstallez Composer en suivant les instructions de la section 2.2.

### Problème : "npm: command not found"

**Solution** : Node.js n'est pas installé. Installez Node.js en suivant la section 2.3.

### Problème : Erreur de connexion à la base de données

**Solution** :

1. Vérifiez que le fichier `database/database.sqlite` existe
2. Si non, créez-le avec : `touch database/database.sqlite` (Mac/Linux) ou `New-Item database/database.sqlite` (Windows)

### Problème : "SQLSTATE[HY000]: General error: 1 no such table"

**Solution** : Les migrations n'ont pas été exécutées. Lancez :

```bash
php artisan migrate:fresh --seed
```

### Problème : Page blanche ou erreur CORS

**Solution** :

1. Vérifiez que le backend est bien lancé sur http://localhost:8000
2. Vérifiez que l'URL dans `.env.local` du frontend est correcte

### Problème : "Storage symlink not found"

**Solution** : Créez le lien symbolique :

```bash
php artisan storage:link
```


### Problème : Erreur lors du login

**Solution** :

1. Vérifiez que vous utilisez les bons identifiants
2. Assurez-vous que les seeders ont été exécutés : `php artisan db:seed`

---

## 8. Commandes utiles

### Backend (Laravel)

```bash
# Lancer le serveur
php artisan serve

# Réinitialiser la base de données
php artisan migrate:fresh --seed

# Vider le cache
php artisan cache:clear
php artisan config:clear

# Voir les routes disponibles
php artisan route:list
```

### Frontend (Next.js)

```bash
# Lancer en développement
npm run dev

# Construire pour la production
npm run build

# Lancer la version de production
npm run start
```

---

## 9. Structure du projet

```
pak-fleet/
├── pak-fleet-backend/                 # API Laravel
│   ├── app/                # Code de l'application
│   ├── database/           # Migrations et seeders
│   ├── routes/             # Routes API
│   └── storage/            # Fichiers uploadés
│
└── pak-fleet-frontend/               # Interface Next.js
    ├── src/
    │   ├── app/           # Pages de l'application
    │   ├── components/    # Composants React
    │   ├── services/      # Services API
    │   └── contexts/      # Contextes React
    └── public/            # Fichiers statiques
```

---

## 10. Support

Si vous rencontrez des problèmes :

1. Vérifiez d'abord la section "Résolution des problèmes"
2. Assurez-vous que tous les prérequis sont installés
3. Redémarrez les serveurs (backend et frontend)
4. Consultez les logs dans le terminal

