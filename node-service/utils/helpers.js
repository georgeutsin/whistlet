module.exports = {
  mysqlDateString: function(dateString) {
    return dateString.replace('T', ' ').substring(0, 19);
  }
}
