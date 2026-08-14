import React from 'react';
import Hero from './Hero';
import LeftSection from './LeftSection';
import RightSection from './RightSection';
import Universe from './Universe';
function ProductsPage() {
    return (
        <>
            <Hero />
            <LeftSection imageURL="media/images/kite.png" productName="Live Market" productDescription="Stay connected to the market with live stock prices and major index movements. Track market changes as they happen and keep an eye on the securities that matter to you." tryDemo="" learnMore="" googlePlay="" appStore="" />
            <RightSection imageURL="media/images/console.png" productName="Portfolio Dashboard" productDescription="Get a clear overview of your investments in one place. Track your holdings, positions, portfolio value, and overall performance through a simple dashboard." learnMore="L" />
            <LeftSection imageURL="media/images/coin.png" productName="Smart Order Management" productDescription="Place and track your orders through a streamlined interface. Review your order history and keep track of your trading activity without switching between different platforms." tryDemo="" learnMore="" googlePlay="" appStore="" />
            <RightSection imageURL="media/images/kiteconnect.png" productName="Market Insights" productDescription="Turn market data into useful information. Explore price movements, index performance, and other market indicators to better understand what's happening in the market." learnMore="" />
            <LeftSection imageURL="media/images/varsity.png" productName="Funds & Positions" productDescription="Keep track of your available funds and open positions alongside your portfolio. Everything you need to monitor your trading activity stays within reach." tryDemo="" learnMore="" googlePlay="" appStore="" />
            <p className='text-center mt-5 mb-5'>TradeLy combines a responsive React frontend, backend APIs, database integration, and real-time market data to create a complete full-stack trading experience.</p>
            <Universe />
        </>
    );
}

export default ProductsPage;