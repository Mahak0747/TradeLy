import React from "react";
function Footer() {
  return (
    <footer style={{ backgroundColor: "rgb(250, 250, 250)" }}>
      <div className="container border-top mt-5">
        <div className="row mt-5">
          <div className="col">
            <img src="media/images/logo.svg" style={{ width: "50%" }} />
            <p>
              &copy; 2026 TradeLy. Built as a personal project.
            </p>
            <p className="mt-5 text-muted" style={{ fontSize: "14px" }}>
              A personal stock-market dashboard project built to explore trading interfaces, portfolio management, and real-time market data.
            </p>
          </div>
          <div className="col">
            <p>Platform</p>
            <a href="">Dashboard</a>
            <br />
            <a href="">Markets</a>
            <br />
            <a href="">Holdings</a>
            <br />
            <a href="">Orders</a>
            <br />
            <a href="">Funds</a>
            <br />
          </div>
          <div className="col">
            <p>Explore</p>
            <a href="">About</a>
            <br />
            <a href="">Features</a>
            <br />
            <a href="">Pricing</a>
            <br />
            <a href="">Support</a>
            <br />
          </div>
          <div className="col">
            <p>Connect</p>
            <a href="">Github</a>
            <br />
            <a href="">LinkedIn</a>
            <br />
            <a href="">Contact</a>
            <br />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;