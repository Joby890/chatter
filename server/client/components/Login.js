var hasAuthed = false;
var loginPrompts;
var signUpPromts;
//listen for connect and get login fields and signup fields
socket.on('connect', function() {
  //If we already have the prompts no need to listen for them
  console.log("connected");
  if(!loginPrompts && !signUpPromts) {
    socket.on('LoginFields', function(data) {
      console.log("Got login fiels", data);
      loginPrompts = data;
      if(signUpPromts && !hasAuthed) {
        gotFields();


      }
    });
    socket.on('SignupFields', function(data) {
      console.log("Got signup fiels", data);
      signUpPromts = data;
      if(loginPrompts && !hasAuthed) {
        gotFields();
      }
    });

  }
});
module.exports = React.createClass({

  getInitialState() {
    return {login: true};
  },
  handleSubmit(e) {
    e.preventDefault();
  },
  sendLogin() {
    var login = this.state.login;
    var loginInfo = {type: (login ? "login" : "signup")};
    if(login) {
      loginPrompts.forEach(function(key) {
        loginInfo[key] = this[key].value;
      });

    } else {
      signUpPromts.forEach(function(key) {
        loginInfo[key] = this[key].value;
      });
    }

    socket.emit('authentication', loginInfo);

  },

  swapForm() {
    this.setState({
      login: !this.state.login,
    });
  },

  render() {
    var fields;
    if(this.state.login) {
      fields = loginPrompts.map(function(key) {
        return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
      });
    } else {
      fields = signUpPromts.map(function(key) {
        return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
      });
    }


    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          {fields}
          <input type='submit' onClick={this.sendLogin} value={this.state.login ? "Login" : "Signup"}/>
        </form>
        <input type='button' onClick={this.swapForm} value={!this.state.login ? "Go to Login" : "Go to Signup"}/>
      </div>
    );
  }

});
