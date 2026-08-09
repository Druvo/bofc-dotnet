pipeline {
    agent any

    environment {
        REMOTE_HOST = '168.107.78.111'
        REMOTE_USER = 'ubuntu'
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
                    bat 'dotnet publish BofcBackend.Api/BofcBackend.Api.csproj -c Release -r linux-arm64 --self-contained true -o publish -p:PublishSingleFile=true'
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
                sshagent(['vps-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl stop bofc-dotnet" || echo "Service not running yet"
                        scp -o StrictHostKeyChecking=no -r bofc-backend-dotnet/publish/* %REMOTE_USER%@%REMOTE_HOST%:%DEPLOY_DIR%/publish/
                    """
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sshagent(['vps-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "rm -rf %DEPLOY_DIR%/frontend/*"
                        scp -o StrictHostKeyChecking=no -r bofc-frontend/build/. %REMOTE_USER%@%REMOTE_HOST%:%DEPLOY_DIR%/frontend/
                    """
                }
            }
        }

        stage('Start & Verify') {
            steps {
                sshagent(['vps-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "chmod +x %DEPLOY_DIR%/publish/BofcBackend.Api && sudo systemctl start bofc-dotnet && sleep 5 && sudo systemctl is-active bofc-dotnet"
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "curl -s -o /dev/null -w '%%{http_code}' http://127.0.0.1:80/ || echo 'Frontend check'"
                    """
                }
            }
        }
    }

    post {
        failure {
            echo 'BOFC .NET deployment FAILED! Check logs and consider rollback.'
        }
        success {
            echo 'BOFC .NET deployed successfully to http://168.107.78.111'
        }
    }
}
