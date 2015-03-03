var BusterBox = React.createClass({
  loadFromServer: function () {
    $.ajax({
      url: this.props.url,
      dataType:'json',
      success: function(data) {
        this.setState({data: data});
        console.log(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  appendData: function (data) {
    data.forEach(function (current) {
      this.state.data.push(current);
    });
  },
  getInitialState: function () {
    return {data: []};
  },
  componentDidMount: function () {
    this.loadFromServer();
  },
  render: function () {
    return (
      <div className="busterBox">
        <BusterList data={this.state.data} />
      </div>
    );
  }
});

var BusterList = React.createClass({
  render: function () {
    var busterNodes = this.props.data.map(function (node) {
      return (
        <BusterNode name={node.name} url={node.url} />
      );
    });
    return (
      <div className="busterList">
        {busterNodes}
      </div>
    );
  }
});

var BusterTweet = React.createClass({
  render: function () {
    var url = "https://twitter.com/intent/tweet?text=" + this.props.data.name +
              "&url=" + this.props.data.url;
    return (
      <div className="tweetImg">
        <a href={url} target="_blank">
          <img src="img/tweet.png" width="24" height="24" />
        </a>
      </div>
    );
  }
});

var BusterNode = React.createClass({
  unmount: function () {
    var node = this.getDOMNode();
    React.unmountComponentAtNode(node);
    $(node).remove();
  },
  handleClick: function (e) {
    this.unmount();
  },
  render: function () {
    var url = this.props.url || '';
    url = url.length <= 60 ? url : url.slice(0, 30) + '...' + url.slice(-30);

    return (
      <div className="busterNode">
        <BusterTweet data={this.props} />
        <div className="deleteNode" onClick={this.handleClick}>✖</div>
        <div className="busterTweet">
          {this.props.name} <a href={this.props.url} target="_blank">{url}</a>
        </div>
      </div>
    );
  }
});


var busterComponent = React.render(
  <BusterBox url="/link" />,
  document.getElementById('content')
);


$(document).ready(function () {
  $('div.add-more').on('click', function () {
    $.getJSON('/link', function (data) {
      var state = busterComponent.state;
      data.forEach(function (current) {
        state.data.push(current);
      });
      busterComponent.setState(state);
    });
  });
});
