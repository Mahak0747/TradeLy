import React from "react";

function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      <div className="p-5" id="supportWrapper">
        <h4>TradeLy Support</h4>
      </div>
      <div className="p-5" id="supportWrapper2">
        <div className="col-6 p-3">
          <h1 className="fs-4 mb-3">
            Find answers, explore the platform, or get help with a problem.
          </h1>
          <input className="mb-3" placeholder="Eg: how do i activate F&O, why is my order is getting rejected.." />
          <br />
          <a href="">Getting Started</a>&ensp;
          <a href="">Dashboard Guide</a>&ensp;
          <a href="">Understanding Orders</a>&ensp;
          <a href="">Managing Your Portfolio</a>
        </div>
        <div className="col-6 p-3">
          <h1 className="fs-4">Featured</h1>
          <ol>
            <li>
              <a href="">Getting started with TradeLy</a>
            </li>
            <li>
              <a href="">Understanding your trading dashboard</a>
            </li>
            <li>
              <a href="">How live market data works</a>
            </li>
            <li>
              <a href="">Managing holdings and positions</a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Hero;