module.exports = {
    "extends": "standard",
    "rules": {
        "no-var": 2,
        "semi": 0,
        "indent": ["error", 4],
        "space-before-function-paren": ["error", {
            "anonymous": "always",
            "named": "never",
            "asyncArrow": "always"
        }],
    }
};