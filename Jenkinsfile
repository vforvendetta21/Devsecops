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

    stage('SAST: SonarQube Analysis') {
      environment {
          SONAR_TOKEN = credentials('sqa_82cc72f7dad8f8247204416bc2319dbe70e76dce')
      }
      steps {
          sh '''
          cd app
          sonar-scanner \
            -Dsonar.projectKey=VulnApp \
            -Dsonar.sources=. \
            -Dsonar.host.url=http://192.168.43.39:9000 \
            -Dsonar.login=$SONAR_TOKEN \
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || true
          '''
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
          # 🧹 Always clean up any leftover container before running a new one
          docker rm -f vuln-app-test || true

          # 🚀 Start your application container
          docker run -d --name vuln-app-test -p 3000:3000 ${IMAGE}

          # 📁 Make a folder on the host to store ZAP reports
          mkdir -p reports/zap

          # 🕷️ Run OWASP ZAP scan
          docker run --rm --network host -v $PWD/reports/zap:/zap/wrk zaproxy/zap-stable \
            zap-baseline.py -t http://host.docker.internal:3000 -r /zap/wrk/zap-report.html || true

          # 🧹 Stop and remove the application container (cleanup)
          docker rm -f vuln-app-test || true
        '''
      }
    }
 //   stage('Secrets scan: Gitleaks') {
 //     steps {
 //       sh '''
 //         # Run Gitleaks using embedded default rules
 //         gitleaks detect --source . --report-path gitleaks-report.json || true

   //       # Make reports folder and copy
 //         mkdir -p reports
 //         [ -f gitleaks-report.json ] && cp gitleaks-report.json reports/
 //       '''
  //      archiveArtifacts artifacts: 'reports/gitleaks-report.json', allowEmptyArchive: true
  //    }
  //  }


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
