
// Print out the list of functions that we want to export from libarchive.
console.log(JSON.stringify([
  "_archive_read_new",
  "_archive_read_support_compression_all",
  "_archive_read_support_format_all",
  "_archive_read_support_filter_all",
  "_archive_read_open",
  "_archive_read_next_header",
  "_archive_read_data",
  "_archive_read_data_skip",
  "_archive_read_data_to_buffer",
  "_archive_read_data_block",
  "_archive_read_close",
  "_archive_read_finish",

  "_archive_read_open_memory",
  "_archive_entry_pathname",
  "_archive_error_string",

  "_archive_read_set_open_callback",
  "_archive_read_set_read_callback",
  "_archive_read_set_seek_callback",
  "_archive_read_set_skip_callback",
  "_archive_read_set_close_callback",

  "_free",
]));
