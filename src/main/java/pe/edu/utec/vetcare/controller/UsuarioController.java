package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.UsuarioRequest;
import pe.edu.utec.vetcare.dto.request.ActualizarUsuarioRequest;
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
            @RequestBody UsuarioRequest request
    ) {

        return usuarioService.crear(request);
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(
            @PathVariable Long id,
            @Valid
            @RequestBody ActualizarUsuarioRequest request
    ) {

        return usuarioService.actualizar(
                id,
                request
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(
            @PathVariable Long id
    ) {

        usuarioService.eliminar(id);
    }
}