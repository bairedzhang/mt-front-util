module.exports = {
    global: {
        proxyRoot: '/tmp/tencent_proxy',
        serverRoot: '/usr/local/app/resin_bairedzhang/webapps'
    },
    projects: {
        'photo': '/Users/bairedzhang/Dropbox/tencent/frontend/apps/photo/mt.conf'
    },
    proxy: {
        port: '8088',
        map: {
            'g': 'info'
        },
        open: true
    }
};
