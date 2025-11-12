pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Pulling code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing project dependencies...'
                sh 'npm install'
            }
        }

        stage('Build Project') {
            steps {
                echo 'Building the website...'
                sh 'npm run build'
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                echo 'Archiving build files...'
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }
    }

    post {
        success {
            echo '✅ Build completed successfully!'
        }
        failure {
            echo '❌ Build failed. Please check the logs.'
        }
    }
}
