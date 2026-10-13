package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.ChangePasswordRequest;
import pe.edu.utec.vetcare.dto.request.CreateUsuarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateMyProfileRequest;
import pe.edu.utec.vetcare.dto.request.UpdateUsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.service.UsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @GetMapping("/{id}")
    public UsuarioResponse obtener(
            @PathVariable Long id
    ) {
        return usuarioService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(
            @Valid
            @RequestBody CreateUsuarioRequest request
    ) {
        return usuarioService.crear(request);
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(
            @PathVariable Long id,
            @Valid
            @RequestBody UpdateUsuarioRequest request
    ) {
        return usuarioService.actualizar(
                id,
                request
        );
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarContrasena(
            @PathVariable Long id,
            @Valid
            @RequestBody ChangePasswordRequest request
    ) {
        usuarioService.cambiarContrasena(
                id,
                request
        );
    }

    @PutMapping("/me")
    public UsuarioResponse actualizarMiPerfil(
            @Valid
            @RequestBody UpdateMyProfileRequest request
    ) {
        return usuarioService.actualizarMiPerfil(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(
            @PathVariable Long id
    ) {
        usuarioService.eliminar(id);
    }
}