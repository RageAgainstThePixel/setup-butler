# setup-butler

A Github Action to setup the [butler](https://github.com/itchio/butler) command line tools for itch.io content authoring.

## How to use

### workflow

```yaml
jobs:
  validate:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    steps:
      # download and setup butler
      - uses: RageAgainstThePixel/setup-butler@v2
        with:
          api-key: ${{ secrets.BUTLER_API_KEY }}
      # run butler commands
      - name: Upload to itch.io
        # https://itch.io/docs/butler/pushing.html
        run: butler push directory user/game:channel
```

The action runs `butler login` with the `api-key`, so later steps don't need `BUTLER_API_KEY`. The post step runs `butler logout` and deletes the itch config directory.

### inputs

| name | description | required |
| ---- | ----------- | -------- |
| `api-key` | An [api key for your itch.io account](https://itch.io/user/settings/api-keys) | true |
| `version` | The version of butler to install, as `x.y.z` (a leading `v` is allowed). Defaults to `latest`. | false |

### outputs

- `path`: The full path to the butler executable.
- `version`: The installed butler version.

### environment variables

- `BUTLER_PATH`: The full path to the butler executable.
- `BUTLER_DIR`: The directory where butler is installed.
