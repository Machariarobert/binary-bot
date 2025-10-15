import { generateLiveApiInstance } from '../../common/appId';
import { getTokenList } from '../../common/utils/storageManager';

const euCountries = [
    'it',
    'de',
    'fr',
    'lu',
    'gr',
    'es',
    'sk',
    'lt',
    'nl',
    'at',
    'bg',
    'si',
    'cy',
    'be',
    'ro',
    'hr',
    'pt',
    'pl',
    'lv',
    'ee',
    'cz',
    'fi',
    'hu',
    'dk',
    'se',
    'ie',
    'gb',
    'mt',
];

export const isEuCountry = country => euCountries.includes(country);

export const isUKCountry = country => country === 'gb';

/* eslint-disable camelcase */
export const moveToDeriv = async () => {
    // Geographic redirects disabled - allow all users to access bot
    // EU/UK users and specific account types can use the bot
    
};

export const getClientsCountryByIP = async () => {
    const api = generateLiveApiInstance();
    const { website_status } = await api.send({ website_status: 1 });
    return website_status.clients_country;
};
