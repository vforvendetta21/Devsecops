pipeline {
    agent any   // Utilise l’agent maître (pas besoin de label 'docker' pour l'instant)
    
    environment {
        NODE_ENV = "development"
    }

    stages {
        stage('Checkout') {
            steps {
                // Récupère le code depuis GitHub
                git branch: 'main', url: 'https://github.com/myusername/Devsecops.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                // Installe les dépendances npm
                sh 'cd app && npm install'
            }
        }

        stage('Run App (test)') {
            steps {
                // Lance l’application pour vérifier qu’elle démarre
                sh 'cd app && node app.js & sleep 5'  // Lancement rapide pour test
            }
        }

        stage('SAST Scan') {
            steps {
                // Exemple de scan Semgrep simple
                sh 'cd app && semgrep --config=../semgrep.yml'
            }
        }

        stage('Finish') {
            steps {
                echo 'Pipeline minimal terminé ✅'
            }
        }
    }

    post {
        always {
            echo 'Build terminé, succès ou échec.'
        }
    }
}
