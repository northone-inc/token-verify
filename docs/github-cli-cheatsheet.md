- `brew install gh` (or `brew bundle` with Brewfile)

- ```bash gh completion --shell zsh > $ZSH_CUSTOM/plugins/gh.zsh```

- ```bash open ~/.zshrc```

```
# github
compctl -K _gh gh
```

Source: https://khalidabuhakmeh.com/ohmyzsh-github-cli-command-completion