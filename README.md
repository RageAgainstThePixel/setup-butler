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
      - uses: RageAgainstThePixel/setup-butler@v1
        with:
          api-key: ${{ secrets.BUTLER_API_KEY }}
      # run butler
      - run: butler -V
```

### inputs

| name | description | required |
| ---- | ----------- | -------- |
| .... | ........... | ........ |
| `api-key` | An [api key for your itch.io account](https://itch.io/user/settings/api-keys) | true |
| `version` | The version of butler to install. Defaults to `latest`. | false |
| `self-update` | Update butler to the latest version. Defaults to `true`. | false |

### outputs

### environment variables

- `BUTLER_PATH`: The `butler` directory location.
- `BUTLER_DIR`: The directory where butler is installed.
