docker build --tag=build_libarchive .

# Cannot use --volume because that changes the nature of the filesystem in the
# container, and it no longer supports soft links.  Need to instead build and
# exfiltrate built files.

$containerName = (docker run -dit build_libarchive /work/compile.sh | Out-String).Trim()

# Wait for command to finish running.
docker attach "$containerName"

$sourceLibs = "${containerName}:/work"
if (!(Test-Path -Path "libs")) {
  mkdir libs
}

docker cp --follow-link "${sourceLibs}/libarchive.js" "libs\libarchive.js"
# docker cp --follow-link "${sourceLibs}/libarchive.js.mem" "libs\libarchive.js.mem"
docker rm "$containerName"
