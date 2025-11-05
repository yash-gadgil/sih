allow_k8s_contexts('docker-desktop')

k8s_yaml(['k8s/namespace.yaml'])
k8s_yaml(['k8s/persistent-volumes.yaml'])
k8s_yaml(['k8s/backend-deployment.yaml', 'k8s/backend-service.yaml'])
k8s_yaml(['k8s/frontend-deployment.yaml', 'k8s/frontend-service.yaml'])

docker_build(
    'sih-backend',
    context='./prototype',
    dockerfile='./prototype/Dockerfile',
    live_update=[
        sync('./prototype', '/app'),
        run('echo "Python files updated, Flask will auto-reload in debug mode"'),
    ],
)

docker_build(
    'sih-frontend',
    context='.',
    dockerfile='./Dockerfile',
    build_args={'NEXT_PUBLIC_BASE_URL': 'http://backend:5000'},
    live_update=[
        sync('./src', '/app/src'),
        sync('./public', '/app/public'),
    ],
)

k8s_resource(
    'backend',
    port_forwards=['5001:5000'],
    labels=['backend'],
    resource_deps=['namespace'],
)

k8s_resource(
    'frontend',
    port_forwards=['3000:3000'],
    labels=['frontend'],
    resource_deps=['backend'],
)

local_resource(
    'upload-resumes',
    cmd='cd prototype && chmod +x resume_uploader.sh && ./resume_uploader.sh',
    resource_deps=['backend'],
    auto_init=False,
    labels=['scripts'],
)

load('ext://restart_process', 'docker_build_with_restart')
