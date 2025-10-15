/* eslint-disable import/no-extraneous-dependencies */
import 'jquery-ui/ui/widgets/dialog';
import 'notifyjs-browser';
import View from './View';
import '../../common/binary-ui/dropdown';
import Elevio from '../../common/elevio';
import GTM from '../../common/gtm';
import { isBinaryDomain, isProduction } from '../../common/utils/tools';
import { oauthLogin } from '../../common/appId';

$.ajaxSetup({
    cache: false,
});

// eslint-disable-next-line no-underscore-dangle
window._trackJs = {
    token      : process.env.TRACKJS_TOKEN,
    application: 'binary-bot',
    enabled    : isProduction(),
    console    : {
        display: false,
    },
};

// Should stay below the window._trackJs config
require('trackjs');

// Handle OAuth callback before initializing the view
oauthLogin(() => {
    // Only initialize view if we're not being redirected by oauthLogin
    const view = new View();

    view.initPromise
        .then(() => {
            $('.show-on-load').show();
            $('.barspinner').hide();
            window.dispatchEvent(new Event('resize'));
            Elevio.init();
            GTM.init();
            if (trackJs) {
                trackJs.configure({
                    userId: $('.account-id')
                        .first()
                        .text(),
                });
            }
        })
        .catch(error => {
            console.error('View initialization failed:', error);
            // Ensure UI is visible even on error
            $('.show-on-load').show();
            $('.barspinner').hide();
            // Make sure bot-main is visible
            const botMain = document.getElementById('bot-main');
            if (botMain && botMain.classList.contains('hidden')) {
                botMain.classList.remove('hidden');
            }
            const toolbox = document.getElementById('toolbox');
            if (toolbox && toolbox.classList.contains('hidden')) {
                toolbox.classList.remove('hidden');
            }
        });

    if (!isBinaryDomain) {
        // eslint-disable-next-line no-unused-expressions
        document.getElementsByClassName('dbot-banner__separator')[0]?.remove();
        // eslint-disable-next-line no-unused-expressions
        document.getElementById('logo')?.remove();
    }
});
