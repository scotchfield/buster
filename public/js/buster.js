var BusterBox = React.createClass({
  loadFromServer: function() {
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
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadFromServer();
  },
  render: function() {
    return (
      <div className="busterBox">
        <BusterList data={this.state.data} />
      </div>
    );
  }
});

var BusterList = React.createClass({
  render: function() {
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

var BusterNode = React.createClass({
  render: function() {
    return (
      <div className="busterNode">
      <span>{this.props.name} <a href={this.props.url}>{this.props.url}</a></span>
      </div>
    );
  }
});


React.render(
  <BusterBox url="/links" />,
  document.getElementById('content')
);
