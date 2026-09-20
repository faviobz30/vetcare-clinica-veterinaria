package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.response.HistoriaClinicaResponse;

public interface HistoriaClinicaService {

    HistoriaClinicaResponse obtener(Long id);

    HistoriaClinicaResponse
    obtenerPorMascota(Long idMascota);
}