import React from 'react';
import {createUrl} from '../../common/utils/tools';

const Logo = () => (
    <a href={createUrl({path: '', isNonBotPage: true})} target="blank" id="logo">
        <div className="logo-parent">
            <img className="responsive" src={'/image/banner.png'} alt="Binary Bot"/>
        </div>
    </a>
);
export default Logo;