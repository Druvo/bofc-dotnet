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
                    bat 'dotnet publish BofcBackend.Api/BofcBackend.Api.csproj -c Release -r linux-arm64 --self-contained true -p:PublishSingleFile=true -o publish'
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
            options {
                timeout(time: 15, unit: 'MINUTES')
            }
        }

        stage('Snapshot (pre-deploy)') {
            steps {
                sshagent(['vps-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "mkdir -p /opt/bofc-dotnet/snapshots/%BUILD_ID%/publish /opt/bofc-dotnet/snapshots/%BUILD_ID%/frontend && cp -r /opt/bofc-dotnet/publish/* /opt/bofc-dotnet/snapshots/%BUILD_ID%/publish/ 2>/dev/null; cp -r /opt/bofc-dotnet/frontend/* /opt/bofc-dotnet/snapshots/%BUILD_ID%/frontend/ 2>/dev/null; echo Snapshot saved"
                    """
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                sshagent(['vps-ssh']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl stop bofc-dotnet" || echo "Service not running yet"
                        scp -o StrictHostKeyChecking=no -r bofc-backend-dotnet/publish/. %REMOTE_USER%@%REMOTE_HOST%:%DEPLOY_DIR%/publish/
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "chmod +x %DEPLOY_DIR%/publish/BofcBackend.Api"
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
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl start bofc-dotnet"
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do curl -sf -o /dev/null -w '%%{http_code}' http://127.0.0.1:8080/auth/login | grep -q '405' && echo Backend is UP && break; echo Waiting...; sleep 2; done"
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "sudo systemctl is-active bofc-dotnet"
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% "curl -sk -o /dev/null -w '%%{http_code}' https://127.0.0.1/ || echo 'Frontend check'"
                    """
                }
            }
        }
    }

    post {
        failure {
            echo 'BOFC VPS deployment FAILED! Rollback: restore snapshot from /opt/bofc-dotnet/snapshots/'
        }
        success {
            echo 'BOFC .NET deployed successfully to https://originalsfootball.club'
        }
    }
}
