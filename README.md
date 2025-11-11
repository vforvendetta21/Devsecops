# vuln-app-devsecops

Application pédagogique vulnérable (Node.js / Express) utilisée pour un projet DevSecOps.

## Structure
- app/ : code source Node.js
- Dockerfile
- Jenkinsfile
- semgrep.yml, .gitleaks.toml, sonar-project.properties

## Usage local
1. `cd app && npm ci`
2. `node app.js`
3. Visit `http://localhost:3000`

## Pipeline
- Jenkinsfile contient stages: checkout, build, SAST (eslint, semgrep), SCA (npm audit, trivy), docker build + trivy image, DAST (OWASP ZAP), gitleaks, sonar-scanner.
- Push -> webhook -> Jenkins déclenche automatiquement.

## Notes
- Ne pas committer `.env`. Voir `.env.example`.
- App vulnérable volontairement pour démonstration : ne pas déployer en production.
"// test Jenkins pipeline" 
"//test webhook ngrok" 
"//test webhook ngrok1" 
"//test webhook ngrok2" 
