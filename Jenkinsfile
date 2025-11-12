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
          mkdir -p ../reports
          if [ -f semgrep-report.json ]; then
            cp semgrep-report.json ../reports/
          fi
        '''
      }
    }

    stage('SCA: npm audit & Trivy (dependencies)') {
      steps {
        sh '''
          cd app
          npm audit --json > npm-audit.json || true
          trivy fs --quiet --format json -o trivy-deps.json . || true
          mkdir -p ../reports
          [ -f npm-audit.json ] && cp npm-audit.json ../reports/
          [ -f trivy-deps.json ] && cp trivy-deps.json ../reports/
        '''
      }
    }

    stage('Docker Build + Scan') {
      steps {
        sh '''
          docker build -t ${IMAGE} .
          trivy image --format json -o trivy-image.json ${IMAGE} || true
          mkdir -p reports
          [ -f trivy-image.json ] && cp trivy-image.json reports/
        '''
      }
    }

    stage('DAST: OWASP ZAP baseline') {
      steps {
        sh '''
              # Start your application container
          docker run -d --name vuln-app-test -p 3000:3000 ${IMAGE}

          # Run OWASP ZAP scan using the pulled stable image
          docker run --rm --network host zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:3000 -r zap-report.html || true

          # Stop and remove the application container
          docker rm -f vuln-app-test || true

          # Make reports folder and copy ZAP report
          mkdir -p reports
          [ -f zap-report.html ] && cp zap-report.html reports/
        '''
      }
    }

    stage('Secrets scan: Gitleaks') {
      steps {
        sh '''
          gitleaks detect --source . --report-path gitleaks-report.json || true
          mkdir -p reports
          [ -f gitleaks-report.json ] && cp gitleaks-report.json reports/
        '''
      }
    }

    stage('Collect Reports') {
      steps {
        echo "Reports collected in 'reports/' folder"
        archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true
      }
    }
  }

  post {
    always {
      publishHTML(target: [
        reportDir: '.',
        reportFiles: 'zap-report.html',
        reportName: 'ZAP Report',
        allowMissing: true
      ])
    }

    success {
      emailext(
        to: 'benhajbrahimm@gmail.com',
        subject: "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """
        <html>
          <body style="font-family:Arial, sans-serif;">
            <h2>✅ DevSecOps Pipeline Completed Successfully</h2>
            <p>Hello,</p>
            <p>The following security checks have been completed successfully:</p>
            <ul>
              <li><b>🧠 SAST:</b> Semgrep</li>
              <li><b>🧩 SCA:</b> Trivy & npm audit</li>
              <li><b>🕷️ DAST:</b> OWASP ZAP</li>
              <li><b>🔐 Secrets Scan:</b> Gitleaks</li>
            </ul>
            <p>Attached are the main reports. You can also view the full build details here:</p>
            <p><a href="${env.BUILD_URL}" target="_blank">${env.BUILD_URL}</a></p>
            <p>Best regards,<br><b>Jenkins DevSecOps Pipeline</b></p>
          </body>
        </html>
        """,
        mimeType: 'text/html',
        attachmentsPattern: 'reports/*'
      )
    }

    failure {
      emailext(
        to: 'benhajbrahimm@gmail.com',
        subject: "❌ Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """
        <html>
          <body style="font-family:Arial, sans-serif;">
            <h2>❌ DevSecOps Pipeline Failed</h2>
            <p>The pipeline failed during execution.</p>
            <p>Please check the Jenkins build console for details:</p>
            <p><a href="${env.BUILD_URL}" target="_blank">${env.BUILD_URL}</a></p>
            <p>Regards,<br><b>Jenkins DevSecOps Pipeline</b></p>
          </body>
        </html>
        """,
        mimeType: 'text/html',
        attachmentsPattern: 'reports/*'
      )
    }
  }
}
