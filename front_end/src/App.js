import React, { useState, useEffect } from 'react';
import { Route, Link, BrowserRouter, Switch } from 'react-router-dom';
import Footer from './components/footer.js';
import Login from './pages/login.js';
import Dashboard from './pages/dashboard.js';
import Profile from './pages/profile.js';
import Navigation from './components/navigation.js';
import Loading from './components/loading.js';
import { TokenContext, IdentityContext } from './context.js';

function App() {
  const [token, setToken] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setIdentity(JSON.parse(localStorage.getItem("identity")));
    setLoading(false);
    // document.title = "Home Page";
  }, []);

  if (loading) {
    return (
      <div style={{width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <Loading />
      </div>
    );
  }

  return (
    <TokenContext.Provider value={token}>
      <IdentityContext.Provider value={identity}>
        <BrowserRouter>
          <div style={{display: "flex", flexDirection: "column"}}>
            {!loading && token === null 
              ? <div>
                  <Login setToken={setToken} identity={identity} setIdentity={setIdentity} />
                  {/* <Footer /> */}
                </div>
              : <Navigation setToken={setToken} setIdentity={setIdentity} />
            }  
          </div>
        </BrowserRouter>
      </IdentityContext.Provider>
    </TokenContext.Provider>
  );
}

export default App;