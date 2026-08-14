import React from 'react';
import { Link } from "react-router-dom";

function Hero() {
    return (
        <div className='container p-5 md-5'>
            <div className='row text-center'>
                <img src="media/images/homeHero.png" alt='Hero Image' className='mb-5' />
                <h1>Invest smarter. Trade with confidence</h1>
                <p>A simple and intuitive platform to track markets, manage your portfolio, and make informed trading decisions</p>
                <button className='p-2 btn btn-primary fs-5 mb-5' style={{ width: "20%", margin: "0 auto" }}>Signup Now</button>
            </div>
        </div>
    );
}

export default Hero;