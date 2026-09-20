package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.PropietarioRequest;
import pe.edu.utec.vetcare.dto.response.PropietarioResponse;
import pe.edu.utec.vetcare.service.PropietarioService;

import java.util.List;

@RestController
@RequestMapping("/api/propietarios")
@RequiredArgsConstructor
public class PropietarioController {

    private final PropietarioService propietarioService;

    @GetMapping
    public List<PropietarioResponse> listar() {

        return propietarioService.listar();
    }

    @GetMapping("/{id}")
    public PropietarioResponse obtener(
            @PathVariable Long id
    ) {

        return propietarioService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PropietarioResponse crear(
            @Valid
            @RequestBody PropietarioRequest request
    ) {

        return propietarioService.crear(request);
    }

    @PutMapping("/{id}")
    public PropietarioResponse actualizar(
            @PathVariable Long id,
            @Valid
            @RequestBody PropietarioRequest request
    ) {

        return propietarioService.actualizar(
                id,
                request
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(
            @PathVariable Long id
    ) {

        propietarioService.eliminar(id);
    }
}