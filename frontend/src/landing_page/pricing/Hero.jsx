import React from 'react';
function Hero() {
    return (
        <div className="container">
            <div className="row p-5 mt-5 border-bottom text-center">
                <h1>Simple. Transparent. No surprises.</h1>
                <h3 className='fs-5 text-muted mt-3'>Explore TradeLy with a straightforward pricing model designed for a seamless trading experience.</h3>
            </div>
            <div className="row p-5 mt-5 text-center">
                <div className="col-4 p-4 ">
                    <img src="media/images/pricingEquity.svg" />
                    <h1 className='fs-3'>Free Market Tracking</h1>
                    <p className="text-muted">Explore live market prices, index movements, and stock information without any subscription or platform fee.</p>
                </div>
                <div className="col-4 p-4 ">
                    <img src="media/images/pricingEquity.svg" />
                    <h1 className='fs-3'>Portfolio & Dashboard</h1>
                    <p className="text-muted">Track your holdings, positions, orders, and available funds from a single dashboard.</p>
                </div>
                <div className="col-4 p-4 ">
                    <img src="media/images/pricingEquity.svg" />
                    <h1 className='fs-3'>Demo Trading</h1>
                    <p className="text-muted">Practice the complete trading workflow in a simulated environment without using real money.</p>
                </div>
            </div>
        </div>
    );
}

export default Hero;