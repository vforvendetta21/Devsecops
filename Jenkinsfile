pipeline {
  agent { label 'docker' }
  environment {
    IMAGE = "vuln-app:${env.BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build') {
      steps {
        sh 'cd app && npm ci'
      }
    }

    stage('SAST: ESLint + Semgrep') {
      steps {
        sh '''
          cd app
          npx eslint . || true
          semgrep --config ../semgrep.yml --json --output semgrep-report.json || true
        '''
        archiveArtifacts artifacts: 'app/semgrep-report.json', allowEmptyArchive: true
      }
    }

    stage('SCA: npm audit & Trivy (dependencies)') {
      steps {
        sh '''
          cd app
          npm audit --json > npm-audit.json || true
          trivy fs --quiet --format json -o trivy-deps.json .
        '''
        archiveArtifacts artifacts: 'app/npm-audit.json, trivy-deps.json', allowEmptyArchive: true
      }
    }

    stage('Docker Build + Scan') {
      steps {
        sh '''
          docker build -t ${IMAGE} .
          trivy image --format json -o trivy-image.json ${IMAGE} || true
        '''
        archiveArtifacts artifacts: 'trivy-image.json', allowEmptyArchive: true
      }
    }

    stage('DAST: OWASP ZAP baseline') {
      steps {
        sh '''
          docker run -d --name vuln-app-test -p 3000:3000 ${IMAGE}
          docker run --rm --network host owasp/zap2docker-stable zap-baseline.py -t http://host.docker.internal:3000 -r zap-report.html || true
          docker rm -f vuln-app-test || true
        '''
        archiveArtifacts artifacts: 'zap-report.html', allowEmptyArchive: true
      }
    }

    stage('Secrets scan: Gitleaks') {
      steps {
        sh '''
          gitleaks detect --source . --report-path gitleaks-report.json || true
        '''
        archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
      }
    }

 //   stage('SonarQube Analysis') {
 //     steps {
 //       withSonarQubeEnv('SonarQube') {
 //         sh 'sonar-scanner'
 //       }
 //     }
//    }
  }

  post {
  always {
    echo "📦 Archiving all reports..."
    archiveArtifacts artifacts: '**/*.json, **/*.html', allowEmptyArchive: true
  }

  success {
    echo "✅ Build succeeded, sending full report email..."
    mail to: 'benhajbrahimm@gmail.com',
         subject: "✅ Jenkins Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
         body: """\
Hello,

The Jenkins pipeline *${env.JOB_NAME}* (build #${env.BUILD_NUMBER}) completed successfully.

📊 Reports generated:
- SAST (Semgrep / ESLint)
- SCA (npm audit / Trivy)
- DAST (OWASP ZAP)
- Secrets (Gitleaks)

You can review the detailed reports attached or directly from Jenkins:
${env.BUILD_URL}

-- Jenkins CI/CD
""",
         attachmentsPattern: '**/*.json, **/*.html'
  }

  failure {
    echo "❌ Build failed, sending failure report email..."
    mail to: 'benhajbrahimm@gmail.com',
         subject: "❌ Jenkins Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
         body: """\
Hello,

The Jenkins pipeline *${env.JOB_NAME}* (build #${env.BUILD_NUMBER}) has failed.

Please review the attached reports and logs for more information:
${env.BUILD_URL}

-- Jenkins CI/CD
""",
         attachmentsPattern: '**/*.json, **/*.html'
  }
}
}