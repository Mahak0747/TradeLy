import React from "react";

function Team() {
  return (
    <div className="container">
      <div className="row p-3 mt-5 border-top">
        <h1 className="text-center ">Behind the project</h1>
      </div>

      <div
        className="row p-3 text-muted"
        style={{ lineHeight: "1.8", fontSize: "1.2em" }}
      >
        <div className="col-6 p-3 text-center">
          <img
            src="media/images/mahakGoswami.jpeg"
            style={{ borderRadius: "100%", width: "50%" }}
          />
          <h4 className="mt-5">Mahak Goswami</h4>
          <h6>Developer & Creator</h6>
        </div>
        <div className="col-6 p-3">
          <p>
            TradeLy was created as a hands-on project to explore full-stack development, financial APIs, real-time market data, and the design of modern trading platforms.
          </p>
          <p>
            The project focuses on turning complex market information into a clean and understandable user experience while connecting the frontend, backend, database, and market-data services into a single application.
          </p>
          <p>
            Connect on <a href="" style={{ textDecoration: "none" }}>Github</a> / <a href="" style={{ textDecoration: "none" }}>LinkedIn</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Team;