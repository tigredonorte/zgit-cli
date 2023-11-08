#!/bin/bash

_zgit_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Determine the script directory dynamically
    script_dir="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
    script_dir="$script_dir/src/commands"

    # Read the command scripts from the src directory and remove the .sh extension to get the command names
    opts=$(ls "$script_dir" | sed 's/\.sh//')

    if [[ ${cur} == * ]] ; then
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
        return 0
    fi
}
complete -F _zgit_completion zgit-cli

# source zgit-cli-completion.bash
