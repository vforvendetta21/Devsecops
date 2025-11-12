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
      archiveArtifacts artifacts: '**/*.json, **/*.html', allowEmptyArchive: true
      publishHTML(target: [
        reportDir: '.',
        reportFiles: 'zap-report.html',
        reportName: 'ZAP Report',
        allowMissing: true
      ])
    }

    failure {
      emailext(
        to: 'benhajbrahimm@gmail.com',
        subject: "❌ Pipeline failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """<p>The build failed. Check Jenkins for details.</p>""",
        attachmentsPattern: '**/*.json, **/*.html',
        mimeType: 'text/html'
      )
    }

    success {
      emailext(
        to: 'benhajbrahimm@gmail.com',
        subject: "✅ Pipeline succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """<p>The build completed successfully! Attached reports below.</p>""",
        attachmentsPattern: '**/*.json, **/*.html',
        mimeType: 'text/html'
      )
    }
  }

}