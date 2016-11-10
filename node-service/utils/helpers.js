module.exports = {
  mysqlDateString: function(dateString) {
    return dateString.replace('T', ' ').substring(0, 19);
  },

  charCountWithoutEmojis: function (text) {
    var re = /:([^\s-]*?):/g;
    var matches = text.match(re) || [];
    return text.length - matches.join('').length + matches.length;
  }
};
