import fs from 'node:fs';
import path from 'path';
import url from 'url';
import webpack from 'webpack';

import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

export default (_, argv) => {
    const isProd = (argv.mode === 'production');
    const isDebug = (argv.mode === 'development');

    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const css_style_loader = { loader: 'style-loader', options: { injectType: isProd ? 'linkTag' : 'singletonStyleTag', }, };
    const css_file_loader = isProd ? ({ loader: 'file-loader', options: { name: '[name].css', }, }) : ({ loader: 'css-loader' });
    const css_module_rule = {
        test: /\.css$/i,
        use: [ css_style_loader, css_file_loader, ],
    };

    const banner_plugin = new webpack.BannerPlugin({
        banner: fs.readFileSync('evolve_automation.meta.js', 'utf8'),
        entryOnly: true,
        raw: true,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 1,
    });

    let terser_minimizer = null, css_minimizer = null;
    if (isProd) {
        terser_minimizer = new TerserPlugin({
            extractComments: false,
            terserOptions: {
                module: true,
                keep_classnames: true,
                keep_fnames: true,
                toplevel: true,
                ie8: true,
                safari10: true,
                compress: {
                    passes: 2,
                    drop_console: [ 'assert', 'count', 'countReset', 'debug', 'info', 'profile', 'profileEnd', 'timeStamp', 'trace', ],
                    hoist_funs: true,
                    keep_infinity: true,
                    typeofs: false,
                    unsafe_arrows: true,
                    unsafe_math: true,
                    unsafe_proto: true,
                    unsafe_regexp: true,
                },
                parse: { bare_returns: true, },
            },
        });
        css_minimizer = new CssMinimizerPlugin();
    }

    return {
        context: path.resolve(__dirname),
        entry: { evolve_automation: './evolve_automation.js', },
        devtool: isProd ? false : isDebug ? 'eval-source-map' : 'eval-cheap-source-map',
        output: {
            filename: '[name].user.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: 'https://cdn.jsdelivr.net/gh/Argavyon/Evolve-Automation/',
        },
        module: {
            rules: [ css_module_rule, ],
        },
        plugins: [ banner_plugin, ],
        optimization: {
            minimize: isProd,
            minimizer: [ terser_minimizer, css_minimizer, ],
        },
    };
}
