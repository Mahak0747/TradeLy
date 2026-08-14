import React from 'react';
function Hero() {
    return (
        <div className='container border-bottom mb-5'>
            <div className='text-center mt-5 p-3'>
                <h1>Powerful tools. One trading platform</h1>
                {/* <h3 className='text-muted mt-3 fs-4'>Explore the tools built into TradeLy</h3> */}
                <p className='mt-3 mb-5'>Explore the tools built into TradeLy to <a href="" style={{ textDecoration: "none" }}>
                    monitor markets, manage your portfolio, and make informed trading decisions from one place.{" "}
                    <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
                </a></p>
            </div>
        </div>
    );
}

export default Hero;