{
  description = "Mistral Playground - SvelteKit web application for the Mistral AI API";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      node_modules = pkgs.stdenv.mkDerivation {
        pname = "mistral-playground-node-modules";
        version = "0.0.1";

        src = ./.;

        nativeBuildInputs = [ pkgs.bun ];

        dontConfigure = true;
        dontFixup = true;

        buildPhase = ''
          runHook preBuild
          export HOME=$TMPDIR
          bun install --frozen-lockfile
          runHook postBuild
        '';

        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r node_modules $out/node_modules
          runHook postInstall
        '';

        outputHashAlgo = "sha256";
        outputHashMode = "recursive";
        outputHash = "sha256-FrGnO9yByXkpOz7wnjFmpD7ADEAaz0T8SDWDxTislIM=";
      };

      mistral-playground = pkgs.stdenv.mkDerivation {
        pname = "mistral-playground";
        version = "0.0.1";

        src = ./.;

        nativeBuildInputs = [
          pkgs.bun
          pkgs.nodejs
        ];

        dontConfigure = true;

        buildPhase = ''
          runHook preBuild
          export HOME=$TMPDIR
          # SvelteKit's post-build analysis imports server modules,
          # which triggers the Neon DB client initialization.
          export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
          cp -a ${node_modules}/node_modules node_modules
          chmod -R u+w node_modules
          node node_modules/vite/bin/vite.js build
          runHook postBuild
        '';

        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r build $out/build
          cp -r node_modules $out/node_modules
          cp package.json $out/
          runHook postInstall
        '';
      };

    in
    {
      packages.${system}.default = mistral-playground;

      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.bun
          pkgs.nodejs
        ];
      };

      checks.${system} = {
        inherit mistral-playground;
        devShell = self.devShells.${system}.default;
      };
    };
}
