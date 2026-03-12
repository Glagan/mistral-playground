{
  description = "Mistral Playground - SvelteKit web application for the Mistral AI API";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.bun
          pkgs.nodejs
        ];
      };

      checks.${system} = {
        devShell = self.devShells.${system}.default;
      };
    };
}
