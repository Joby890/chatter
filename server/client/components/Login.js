var Login = React.createClass({

  getInitialState() {
    return {
      formLogin: true,
      signup: [],
      login: [],
    };
  },
  handleSubmit(e) {
    e.preventDefault();
  },

  componentDidMount() {
    var self = this;
    socket.on("SLFields", function(obj) {
      self.setState({
        signup: obj.signup,
        login: obj.login,
      });
    });
  },

  sendLogin() {
    var login = this.state.formLogin;
    var loginInfo = {type: (login ? "login" : "signup")};
    if(login) {
      this.state.login.forEach(function(key) {
        loginInfo[key] = this[key].value;
      });

    } else {
      this.state.signup.forEach(function(key) {
        loginInfo[key] = this[key].value;
      });
    }

    socket.emit('authentication', loginInfo);

  },

  swapForm() {
    this.setState({
      formLogin: !this.state.formLogin,
    });
  },

  render() {
    var fields;
    if(this.state.formLogin) {
      fields = this.state.login.map(function(key) {
        return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
      });
    } else {
      fields = this.state.signup.map(function(key) {
        return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
      });
    }


    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          {fields}
          <input type='submit' onClick={this.sendLogin} value={this.state.formLogin ? "Login" : "Signup"}/>
        </form>
        <input type='button' onClick={this.swapForm} value={!this.state.formLogin ? "Go to Login" : "Go to Signup"}/>
      </div>
    );
  }

});
module.exports = Login;
