pipeline {
    agent any

    environment {
        REMOTE_HOST = '192.168.0.50'
        REMOTE_USER = 'druvo'
        DEPLOY_DIR  = '/opt/bofc-dotnet'
        REPO_URL    = 'https://github.com/Druvo/bofc-dotnet.git'
    }

    stages {
        stage('Checkout') {
            steps {
                git url: "${REPO_URL}", branch: 'master'
            }
        }

        stage('Build Backend') {
            steps {
                dir('bofc-backend-dotnet') {
                    bat 'dotnet publish BofcBackend.Api/BofcBackend.Api.csproj -c Release -o publish'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('bofc-frontend') {
                    bat 'npm ci'
                    bat 'set REACT_APP_API_URL=/api&& set CI=false&& npm run build'
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                sshagent(['corex-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl stop bofc-dotnet" || echo "Service not running yet"
                        scp -o StrictHostKeyChecking=no -r bofc-backend-dotnet/publish/* %REMOTE_USER%@%REMOTE_HOST%:%DEPLOY_DIR%/publish/
                    """
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sshagent(['corex-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "rm -rf %DEPLOY_DIR%/frontend/*"
                        scp -o StrictHostKeyChecking=no -r bofc-frontend/build/. %REMOTE_USER%@%REMOTE_HOST%:%DEPLOY_DIR%/frontend/
                    """
                }
            }
        }

        stage('Start & Verify') {
            steps {
                sshagent(['corex-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl start bofc-dotnet && sleep 5 && sudo systemctl is-active bofc-dotnet"
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "curl -s -o /dev/null -w '%%{http_code}' http://127.0.0.1:9292/auth/login -X POST -H 'Content-Type: application/json' || echo 'Backend check'"
                    """
                }
            }
        }
    }

    post {
        failure {
            echo 'BOFC .NET deployment FAILED! Rollback: restore snapshot from /opt/bofc-dotnet/snapshots/'
        }
        success {
            echo 'BOFC .NET deployed successfully to https://originalsfootball.club'
        }
    }
}
