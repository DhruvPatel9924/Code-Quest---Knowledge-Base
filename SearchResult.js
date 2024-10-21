// SearchResult.js
const mongoose = require('mongoose');

const searchResultSchema = new mongoose.Schema({
  query: { type: String, required: true },
  results: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SearchResult = mongoose.model('SearchResult', searchResultSchema);

module.exports = SearchResult;
