module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "lucide-react",
            "message": "Import icons from '@/ui/icon-registry' via the Icon adapter instead of importing directly from lucide-react."
          },
          {
            "name": "@tabler/icons-react",
            "message": "Import icons from '@/ui/icon-registry' via the Icon adapter instead of importing directly."
          },
          {
            "name": "@phosphor-icons/react",
            "message": "Import icons from '@/ui/icon-registry' via the Icon adapter instead of importing directly."
          },
          {
            "name": "@radix-ui/react-icons",
            "message": "Import icons from '@/ui/icon-registry' via the Icon adapter instead of importing directly."
          }
        ]
      }
    ]
  },
};
