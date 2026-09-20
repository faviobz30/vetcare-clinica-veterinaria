package pe.edu.utec.vetcare.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.response.HistoriaClinicaResponse;
import pe.edu.utec.vetcare.service.HistoriaClinicaService;

@RestController
@RequestMapping(
        "/api/historias-clinicas"
)
@RequiredArgsConstructor
public class HistoriaClinicaController {

    private final HistoriaClinicaService service;

    @GetMapping("/{id}")
    public HistoriaClinicaResponse obtener(
            @PathVariable Long id
    ) {

        return service.obtener(id);
    }

    @GetMapping(
            "/mascota/{idMascota}"
    )
    public HistoriaClinicaResponse
    obtenerPorMascota(
            @PathVariable Long idMascota
    ) {

        return service.obtenerPorMascota(
                idMascota
        );
    }
}